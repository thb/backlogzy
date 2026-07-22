# Creates one Notification per active account member (except the actor) and emails
# each recipient. Enqueued by Notifications::Emit. Args are plain ids/hashes so the
# job survives a deleted notifiable; `data` keys arrive as strings (JSON round-trip).
class NotifyJob < ApplicationJob
  queue_as :default

  def perform(account_id:, actor_id:, action:, notifiable_type: nil, notifiable_id: nil, data: {})
    account = Account.find_by(id: account_id)
    return unless account

    recipients = account.account_memberships.active.where.not(user_id: actor_id).includes(:user).map(&:user)

    recipients.each do |user|
      notification = Notification.create!(
        account: account, recipient: user, actor_id: actor_id, action: action,
        notifiable_type: notifiable_type, notifiable_id: notifiable_id, data: data
      )
      NotificationMailer.with(notification: notification).new_activity.deliver_later
    end
  end
end
