module Invitations
  # Accepts an invitation: creates the membership, and the user too if the email is new.
  module Accept
    Result = Struct.new(:ok, :error, :user, :existing, keyword_init: true)

    module_function

    def call(token:, name: nil, password: nil)
      invitation = Invitation.pending.find_by(token: token.to_s)
      return Result.new(ok: false, error: :invalid_token) if invitation.nil? || invitation.expired?

      user = User.find_by(email: invitation.email)
      existing = user.present?
      membership = nil

      ActiveRecord::Base.transaction do
        user ||= User.create!(name: name.to_s, email: invitation.email, password: password.to_s)
        membership = AccountMembership.find_or_create_by!(user: user, account: invitation.account) do |m|
          m.role = invitation.role
          m.active = true
        end
        invitation.update!(accepted_at: Time.current)
      end

      notify_member_added(invitation.account, user) if membership.previously_new_record?

      Result.new(ok: true, user: user, existing: existing)
    rescue ActiveRecord::RecordInvalid => e
      Result.new(ok: false, error: e.record.errors.messages)
    end

    # Tell the existing team a new member joined (actor = the new member, excluded).
    def notify_member_added(account, user)
      Notifications::Emit.call(
        account: account, actor: user, action: "member_added", notifiable: user,
        data: { message: "#{user.name} joined the team", url: "/admin" }
      )
    end
  end
end
