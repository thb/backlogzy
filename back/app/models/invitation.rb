class Invitation < ApplicationRecord
  TTL = 7.days

  belongs_to :account
  belongs_to :invited_by, class_name: "User", optional: true

  before_validation :normalize_email
  before_create :ensure_token
  before_create { self.sent_at ||= Time.current }

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: AccountMembership::ROLES }
  validates :email, uniqueness: {
    scope: :account_id,
    conditions: -> { where(accepted_at: nil) },
    message: "already has a pending invitation"
  }

  scope :pending, -> { where(accepted_at: nil) }

  def pending? = accepted_at.nil?
  def expired? = sent_at.present? && sent_at < TTL.ago

  # Re-send the invitation and reset its expiry window.
  def resend!
    update!(sent_at: Time.current)
    InvitationMailer.invite(self).deliver_later
  end

  private

  def normalize_email
    self.email = email.to_s.downcase.strip
  end

  def ensure_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end
end
