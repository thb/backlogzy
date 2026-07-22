module Auth
  # Self-serve registration: creates a brand-new account (workspace) with the
  # signer as its admin. Returns the user (auto-login happens in the controller).
  module Signup
    MIN_PASSWORD = 8

    Result = Struct.new(:ok, :user, :errors, keyword_init: true)

    module_function

    def call(workspace:, name:, email:, password:)
      if password.to_s.length < MIN_PASSWORD
        return Result.new(ok: false, errors: { password: ["must be at least #{MIN_PASSWORD} characters"] })
      end

      account = Account.new(name: workspace.to_s, slug: Account.unique_slug(workspace))
      user = User.new(name: name.to_s, email: email.to_s, password: password.to_s)

      ActiveRecord::Base.transaction do
        account.save!
        user.save!
        AccountMembership.create!(user: user, account: account, role: "admin", active: true)
      end

      Result.new(ok: true, user: user)
    rescue ActiveRecord::RecordInvalid
      Result.new(ok: false, errors: collect_errors(account, user))
    end

    # Map errors to the form's field names (account `name` → `workspace`).
    def collect_errors(account, user)
      errors = {}
      errors[:workspace] = account.errors[:name] if account.errors[:name].any?
      errors.merge!(user.errors.messages) if user.errors.any?
      errors.presence || { base: ["Signup failed"] }
    end
  end
end
