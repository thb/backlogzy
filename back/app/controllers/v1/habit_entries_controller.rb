module V1
  class HabitEntriesController < ApplicationController
    has_scope :from_date, as: :from, allow_blank: false
    has_scope :to_date, as: :to, allow_blank: false

    # GET /v1/habit_entries?from=2026-04-01&to=2026-04-07 — the current user's habits.
    def index
      scoped = apply_scopes(my_entries).order(:date)
      render json: { data: V1::HabitEntryBlueprint.render_as_hash(scoped) }
    end

    # POST /v1/habit_entries/toggle  { date, emoji } — check/uncheck a habit for a day.
    def toggle
      entry = my_entries.find_by(date: params.require(:date), emoji: params.require(:emoji))
      if entry
        entry.destroy!
        render json: { data: { date: params[:date], emoji: params[:emoji], active: false } }
      else
        my_entries.create!(date: params[:date], emoji: params[:emoji])
        render json: { data: { date: params[:date], emoji: params[:emoji], active: true } }
      end
    end

    private

    def my_entries
      current_account.habit_entries.where(user: current_user)
    end
  end
end
