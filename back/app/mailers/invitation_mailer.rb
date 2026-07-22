class InvitationMailer < ApplicationMailer
  def invite(invitation)
    @invitation = invitation
    @account = invitation.account.name
    @accept_url = "#{ENV.fetch('FRONT_URL', 'http://localhost:5173')}/invitations/accept?token=#{invitation.token}"
    mail(to: invitation.email, subject: "You're invited to join #{@account}")
  end
end
