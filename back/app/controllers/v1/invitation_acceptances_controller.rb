module V1
  # Public: preview an invitation and accept it (no auth, no account).
  class InvitationAcceptancesController < ApplicationController
    skip_before_action :authenticate_user!
    skip_before_action :set_current_account
    skip_before_action :verify_account_membership

    # GET /v1/invitations/accept?token=  — drives the accept page UI.
    def show
      invitation = pending_invitation
      return invalid_token unless invitation

      render json: { data: {
        email: invitation.email,
        role: invitation.role,
        account: invitation.account.name,
        needs_password: !User.exists?(email: invitation.email)
      } }
    end

    # POST /v1/invitations/accept  { token, name, password }
    def create
      result = Invitations::Accept.call(token: params[:token], name: params[:name], password: params[:password])

      unless result.ok
        return invalid_token if result.error == :invalid_token

        return render json: { errors: result.error }, status: :unprocessable_entity
      end

      if result.existing
        render json: { data: { existing: true } } # they already have an account → sign in
      else
        render json: {
          data: { existing: false, user: V1::UserBlueprint.render_as_hash(result.user, view: :with_memberships), **Auth::Token.generate_pair(result.user) }
        }, status: :created
      end
    end

    private

    def pending_invitation
      invitation = Invitation.pending.find_by(token: params[:token].to_s)
      invitation unless invitation.nil? || invitation.expired?
    end

    def invalid_token
      render_error("invalid_token", "Invalid or expired invitation", :unprocessable_entity)
    end
  end
end
