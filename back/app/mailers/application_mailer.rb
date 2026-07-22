class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "noreply@roadmapper.fr")
  layout "mailer"
end
