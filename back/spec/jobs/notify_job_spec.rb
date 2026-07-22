require "rails_helper"

RSpec.describe NotifyJob, type: :job do
  include ActiveJob::TestHelper

  let(:account) { create(:account) }
  let(:actor) { create(:user) }
  let(:teammate) { create(:user) }
  let(:other) { create(:user) }

  before do
    create(:account_membership, user: actor, account: account)
    create(:account_membership, user: teammate, account: account)
    create(:account_membership, user: other, account: account)
  end

  def run(actor_id: actor.id)
    described_class.perform_now(
      account_id: account.id, actor_id: actor_id, action: "member_added",
      data: { "message" => "hi", "url" => "/board" }
    )
  end

  it "creates one notification per active member except the actor" do
    expect { run }.to change(Notification, :count).by(2)
    expect(Notification.pluck(:recipient_id)).to match_array([teammate.id, other.id])
  end

  it "notifies everyone when there is no actor" do
    expect { run(actor_id: nil) }.to change(Notification, :count).by(3)
  end

  it "skips inactive members" do
    create(:account_membership, user: create(:user), account: account, active: false)
    expect { run }.to change(Notification, :count).by(2)
  end

  it "enqueues an email per recipient" do
    expect { run }.to have_enqueued_mail(NotificationMailer, :new_activity).twice
  end

  it "no-ops when the account is gone" do
    account_id = account.id
    account.destroy!
    expect do
      described_class.perform_now(account_id: account_id, actor_id: nil, action: "member_added", data: {})
    end.not_to change(Notification, :count)
  end
end
