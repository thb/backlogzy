module V1
  class ImportsController < ApplicationController
    # POST /v1/import — one-time import of a legacy localStorage backup (v1 JSON).
    def create
      result = ImportBackup.call(
        account: current_account,
        user: current_user,
        payload: params.permit!.to_h.slice("projects", "items", "habits", "pomodoros")
      )
      render json: { data: result.to_h }, status: :created
    end
  end
end
