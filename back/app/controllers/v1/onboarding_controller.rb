module V1
  class OnboardingController < ApplicationController
    # The user is authenticated but has no account yet (e.g. just signed up via
    # OAuth), so skip the account-scoping before_actions.
    skip_before_action :set_current_account
    skip_before_action :verify_account_membership

    # POST /v1/onboarding { workspace } — create a workspace owned by the current user.
    def create
      name = params[:workspace].to_s
      account = Account.new(name: name, slug: Account.unique_slug(name))

      ActiveRecord::Base.transaction do
        account.save!
        AccountMembership.create!(user: current_user, account: account, role: "admin", active: true)
      end

      render json: { data: V1::UserBlueprint.render_as_hash(current_user, view: :with_memberships) },
             status: :created
    rescue ActiveRecord::RecordInvalid => e
      errors = e.record.is_a?(Account) ? { workspace: e.record.errors[:name] } : { base: e.record.errors.full_messages }
      render json: { errors: errors }, status: :unprocessable_entity
    end
  end
end
