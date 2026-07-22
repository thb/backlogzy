require "rails_helper"

RSpec.describe "Password reset", type: :feature, js: true do
  let!(:account) { create(:account, slug: "acme") }
  let!(:user) { create(:user, email: "user@example.com", password: "password123", name: "Reset User") }
  let!(:membership) { create(:account_membership, user: user, account: account) }

  it "resets the password end to end" do
    visit "/forgot"
    fill_in "email", with: "user@example.com"
    click_button "Send reset link"
    expect(page).to have_content("reset link is on its way")

    token = user.reload.reset_password_token
    expect(token).to be_present

    visit "/reset?token=#{token}"
    fill_in "password", with: "brandnewpass"
    click_button "Reset password"

    expect(page).to have_button("Sign in")

    fill_in "email", with: "user@example.com"
    fill_in "password", with: "brandnewpass"
    click_button "Sign in"

    expect(page).to have_button("Boards") # logged in, landed on the board
  end
end
