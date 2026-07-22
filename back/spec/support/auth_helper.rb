module AuthHelper
  # Build a valid Authorization + X-Account header set for request specs.
  def auth_headers(user, account = nil)
    headers = {
      "Authorization" => "Bearer #{Auth::Token.generate_pair(user)[:access_token]}",
      "Content-Type" => "application/json",
      "Accept" => "application/json"
    }
    headers["X-Account"] = account.slug if account
    headers
  end
end
