module V1
  class AuthController < ApplicationController
    MIN_PASSWORD = 8

    skip_before_action :set_current_account
    skip_before_action :verify_account_membership
    skip_before_action :authenticate_user!, only: %i[login signup refresh logout oauth_exchange]

    # POST /v1/auth/signup — self-serve: create a workspace + admin user, auto-login.
    def signup
      result = Auth::Signup.call(
        workspace: signup_params[:workspace], name: signup_params[:name],
        email: signup_params[:email], password: signup_params[:password]
      )

      unless result.ok
        return render json: { errors: result.errors }, status: :unprocessable_entity
      end

      render json: {
        data: {
          user: V1::UserBlueprint.render_as_hash(result.user, view: :with_memberships),
          **Auth::Token.generate_pair(result.user)
        }
      }, status: :created
    end

    # POST /v1/auth/login
    def login
      user = User.find_by(email: login_params[:email].to_s.strip.downcase)

      unless user&.authenticate(login_params[:password])
        return render_error("invalid_credentials", "Invalid email or password", :unauthorized)
      end

      render json: {
        data: {
          user: V1::UserBlueprint.render_as_hash(user, view: :with_memberships),
          **Auth::Token.generate_pair(user)
        }
      }
    end

    # POST /v1/auth/refresh
    def refresh
      payload = Auth::Token.decode(params[:refresh_token])

      unless payload && payload["type"] == "refresh" && !Auth::Token.blacklisted?(payload["jti"])
        return render_error("invalid_token", "Invalid refresh token", :unauthorized)
      end

      Auth::Token.blacklist(payload)
      user = User.find(payload["user_id"])

      render json: { data: Auth::Token.generate_pair(user) }
    end

    # DELETE /v1/auth/logout
    def logout
      Auth::Token.blacklist(Auth::Token.decode(bearer_token))
      Auth::Token.blacklist(Auth::Token.decode(params[:refresh_token]))
      head :no_content
    end

    # GET /v1/auth/me
    def me
      render json: { data: V1::UserBlueprint.render_as_hash(current_user, view: :with_memberships) }
    end

    # POST /v1/auth/oauth/exchange  { code } — trade a one-time OAuth handoff code for tokens.
    def oauth_exchange
      payload = Auth::Token.decode(params[:code].to_s)
      if payload.nil? || payload["type"] != "oauth_handoff" || Auth::Token.blacklisted?(payload["jti"])
        return render_error("invalid_code", "Invalid or expired sign-in code", :unauthorized)
      end

      Auth::Token.blacklist(payload) # single-use
      user = User.find(payload["user_id"])
      render json: {
        data: { user: V1::UserBlueprint.render_as_hash(user, view: :with_memberships), **Auth::Token.generate_pair(user) }
      }
    rescue ActiveRecord::RecordNotFound
      render_error("invalid_code", "Invalid or expired sign-in code", :unauthorized)
    end

    # PATCH /v1/auth/me — update the current user's own profile.
    def update
      if current_user.update(profile_params)
        render json: { data: V1::UserBlueprint.render_as_hash(current_user, view: :with_memberships) }
      else
        render json: { errors: current_user.errors.messages }, status: :unprocessable_entity
      end
    end

    # PATCH /v1/auth/password — change own password (requires the current one).
    def change_password
      unless current_user.authenticate(params[:current_password].to_s)
        return render json: { errors: { current_password: ["is incorrect"] } }, status: :unprocessable_entity
      end
      if params[:password].to_s.length < MIN_PASSWORD
        return render json: { errors: { password: ["must be at least #{MIN_PASSWORD} characters"] } }, status: :unprocessable_entity
      end

      current_user.update!(password: params[:password])
      head :no_content
    end

    private

    def login_params
      params.require(:auth).permit(:email, :password)
    end

    def signup_params
      params.require(:auth).permit(:workspace, :name, :email, :password)
    end

    def profile_params
      params.require(:user).permit(:name, :email, :avatar_key)
    end
  end
end
