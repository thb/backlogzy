module V1
  class PomodorosController < ApplicationController
    has_scope :from_date, as: :from, allow_blank: false
    has_scope :to_date, as: :to, allow_blank: false

    # GET /v1/pomodoros?from=2026-04-01&to=2026-04-07 — the current user's counts.
    def index
      scoped = apply_scopes(my_pomodoros).order(:date)
      render json: { data: V1::PomodoroBlueprint.render_as_hash(scoped) }
    end

    # POST /v1/pomodoros/increment  { date }
    def increment
      record = my_pomodoros.find_or_initialize_by(date: params.require(:date))
      record.count += 1
      record.save!
      render json: { data: V1::PomodoroBlueprint.render_as_hash(record) }
    end

    # POST /v1/pomodoros/decrement  { date } — the row disappears at zero.
    def decrement
      record = my_pomodoros.find_by(date: params.require(:date))
      return render json: { data: nil } unless record

      record.count -= 1
      if record.count <= 0
        record.destroy!
        render json: { data: nil }
      else
        record.save!
        render json: { data: V1::PomodoroBlueprint.render_as_hash(record) }
      end
    end

    private

    def my_pomodoros
      current_account.pomodoros.where(user: current_user)
    end
  end
end
