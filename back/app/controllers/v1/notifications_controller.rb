module V1
  class NotificationsController < ApplicationController
    # GET /v1/notifications  (?unread=1 to filter; meta carries the unread_count badge)
    def index
      scope = base_scope
      scope = scope.unread if params[:unread].present?
      @pagy, notifications = pagy(scope.recent.includes(:actor),
                                  page: params[:page].presence || 1,
                                  limit: params[:per_page].presence || 20)

      render json: {
        data: V1::NotificationBlueprint.render_as_hash(notifications),
        meta: pagy_metadata(@pagy).merge(unread_count: base_scope.unread.count)
      }
    end

    # PATCH /v1/notifications/:id/read
    def read
      notification = base_scope.find(params[:id])
      notification.mark_read!
      render json: { data: V1::NotificationBlueprint.render_as_hash(notification) }
    end

    # POST /v1/notifications/read_all
    def read_all
      base_scope.unread.update_all(read_at: Time.current)
      head :no_content
    end

    private

    # Only the current user's notifications, within the current account.
    def base_scope
      Notification.where(recipient: current_user, account: current_account)
    end
  end
end
