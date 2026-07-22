module V1
  class ApplicationController < ActionController::API
    include Pagy::Backend

    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_unprocessable_entity
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing

    before_action :authenticate_user!
    before_action :set_current_account
    before_action :verify_account_membership

    private

    # --- Auth ---

    def authenticate_user!
      return if current_user

      render_error("unauthorized", "Unauthorized", :unauthorized)
    end

    def current_user
      @current_user ||= authenticate_user_from_token
    end

    def authenticate_user_from_token
      payload = Auth::Token.decode(bearer_token)
      return nil unless payload && payload["type"] == "access"
      return nil if Auth::Token.blacklisted?(payload["jti"])

      User.find(payload["user_id"])
    rescue ActiveRecord::RecordNotFound
      nil
    end

    def bearer_token
      request.headers["Authorization"]&.gsub("Bearer ", "")
    end

    # --- Multi-tenant ---

    def set_current_account
      slug = request.headers["X-Account"]
      return render_error("account_header_missing", "X-Account header is required", :bad_request) if slug.blank?

      @current_account = Account.find_by(slug: slug)
      render_error("account_not_found", "Account not found", :not_found) unless @current_account
    end

    def current_account
      @current_account
    end

    def current_membership
      @current_membership
    end

    # Authorization helper (RBAC). Use as a before_action on admin-only actions.
    def require_admin!
      return if current_user&.super_admin?
      return if current_membership&.role == "admin"

      render_error("forbidden", "Admin access required", :forbidden)
    end

    def verify_account_membership
      return unless current_user && current_account
      return if current_user.super_admin?

      @current_membership = AccountMembership.active.find_by(user: current_user, account: current_account)
      return if @current_membership

      render_error("account_access_denied", "Access denied", :forbidden)
    end

    # --- Error handlers ---

    def handle_not_found(error)
      render_error("not_found", error.message, :not_found)
    end

    def handle_unprocessable_entity(error)
      render json: { errors: error.record.errors.messages }, status: :unprocessable_entity
    end

    def handle_parameter_missing(error)
      render_error("parameter_missing", error.message, :bad_request)
    end

    def render_error(type, message, status)
      render json: { error: { type: type, message: message } }, status: status
    end
  end
end
