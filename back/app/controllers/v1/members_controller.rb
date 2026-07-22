module V1
  class MembersController < ApplicationController
    before_action :require_admin!

    # GET /v1/members
    def index
      members = current_account.account_memberships.includes(:user).order(created_at: :asc)
      render json: { data: V1::MembershipBlueprint.render_as_hash(members) }
    end

    # PATCH /v1/members/:id  { membership: { role } }
    def update
      membership = current_account.account_memberships.find(params[:id])
      new_role = params.dig(:membership, :role)

      if membership.role == "admin" && new_role != "admin" && last_admin?
        return render_error("last_admin", "The account must keep at least one admin", :unprocessable_entity)
      end

      if membership.update(role: new_role)
        render json: { data: V1::MembershipBlueprint.render_as_hash(membership) }
      else
        render json: { errors: membership.errors.messages }, status: :unprocessable_entity
      end
    end

    # DELETE /v1/members/:id
    def destroy
      membership = current_account.account_memberships.find(params[:id])

      if membership.user_id == current_user.id
        return render_error("cannot_remove_self", "You can't remove yourself", :unprocessable_entity)
      end
      if membership.role == "admin" && last_admin?
        return render_error("last_admin", "The account must keep at least one admin", :unprocessable_entity)
      end

      membership.destroy!
      head :no_content
    end

    private

    def last_admin?
      current_account.account_memberships.where(role: "admin").count <= 1
    end
  end
end
