module FeatureHelper
  # Log in through the real SPA login form. Forms are uncontrolled, so Capybara's
  # native fill_in works — no react_fill / _valueTracker hacks needed.
  def login_as(user, password: "password")
    visit "/login"
    fill_in "email", with: user.email
    fill_in "password", with: password
    click_button "Sign in"
  end
end
