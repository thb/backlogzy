class UserMailer < ApplicationMailer
  # Reset link points to the SPA, which posts the token back to the API.
  def reset_password(user, token)
    @user = user
    @reset_url = "#{ENV.fetch('FRONT_URL', 'http://localhost:5173')}/reset?token=#{token}"
    mail(to: user.email, subject: "Reset your password")
  end
end
