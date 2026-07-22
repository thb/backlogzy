module V1
  class InvitationsController < ApplicationController
    before_action :require_admin!

    # GET /v1/invitations — pending invitations for the account.
    def index
      invitations = current_account.invitations.pending.order(created_at: :desc)
      render json: { data: V1::InvitationBlueprint.render_as_hash(invitations) }
    end

    # POST /v1/invitations  { invitation: { email, role } }
    def create
      invitation = current_account.invitations.build(invitation_params.merge(invited_by: current_user))

      if invitation.save
        InvitationMailer.invite(invitation).deliver_later
        render json: { data: V1::InvitationBlueprint.render_as_hash(invitation) }, status: :created
      else
        render json: { errors: invitation.errors.messages }, status: :unprocessable_entity
      end
    end

    # POST /v1/invitations/:id/resend — re-send the email and reset the expiry.
    def resend
      current_account.invitations.pending.find(params[:id]).resend!
      head :no_content
    end

    # DELETE /v1/invitations/:id — revoke.
    def destroy
      current_account.invitations.find(params[:id]).destroy!
      head :no_content
    end

    private

    def invitation_params
      params.require(:invitation).permit(:email, :role)
    end
  end
end
