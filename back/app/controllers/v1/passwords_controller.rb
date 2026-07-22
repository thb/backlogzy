module V1
  # Public password-reset endpoints (no auth, no account).
  class PasswordsController < ApplicationController
    MIN_PASSWORD = 8

    skip_before_action :authenticate_user!
    skip_before_action :set_current_account
    skip_before_action :verify_account_membership

    # POST /v1/auth/password/forgot  { email }
    def create
      Auth::PasswordReset.request(params[:email])
      head :accepted # always — don't leak whether the email exists
    end

    # POST /v1/auth/password/reset  { token, password }
    def update
      user = Auth::PasswordReset.resettable_user(params[:token])
      return render_error("invalid_token", "Invalid or expired reset link", :unprocessable_entity) unless user

      if params[:password].to_s.length < MIN_PASSWORD
        return render json: { errors: { password: ["must be at least #{MIN_PASSWORD} characters"] } }, status: :unprocessable_entity
      end

      user.update!(password: params[:password], reset_password_token: nil, reset_password_sent_at: nil)
      head :no_content
    end
  end
end
