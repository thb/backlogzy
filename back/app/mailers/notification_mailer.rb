class NotificationMailer < ApplicationMailer
  # Sent by NotifyJob for each recipient. The human message + link live in the
  # notification's `data` snapshot, so the email and the in-app bell stay in sync.
  def new_activity
    @notification = params[:notification]
    @recipient = @notification.recipient
    @account = @notification.account.name
    @message = @notification.data["message"]
    path = @notification.data["url"].presence || "/dashboard"
    @url = "#{ENV.fetch('FRONT_URL', 'http://localhost:5173')}#{path}"

    mail(to: @recipient.email, subject: "New activity on #{@account}")
  end
end
