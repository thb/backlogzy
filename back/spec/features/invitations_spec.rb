require "rails_helper"

RSpec.describe "Member invitations", type: :feature, js: true do
  let!(:account) { create(:account, slug: "acme", name: "Acme") }
  let!(:admin) { create(:user, email: "admin@example.com", password: "password", name: "Admin") }
  let!(:membership) { create(:account_membership, user: admin, account: account, role: "admin") }

  before { login_as(admin) }

  it "invites a member who then accepts and joins" do
    # Members admin lives behind the settings shell (AppLayout sidebar).
    find("button[aria-label='Open user menu']").click
    find('[role="menuitem"]', text: "Settings").click
    click_link "Members" # → /admin

    fill_in "email", with: "newbie@example.com"
    click_button "Invite"

    expect(page).to have_content("newbie@example.com") # appears in pending list

    token = Invitation.find_by(email: "newbie@example.com").token

    visit "/invitations/accept?token=#{token}"
    expect(page).to have_content("Join Acme")
    fill_in "name", with: "New Bie"
    fill_in "password", with: "password123"
    click_button "Accept invitation"

    # auto-logged in as the new member, landing on the board of the new workspace
    expect(page).to have_css("header", text: "Acme")
    expect(account.reload.users.map(&:email)).to include("newbie@example.com")
  end
end
