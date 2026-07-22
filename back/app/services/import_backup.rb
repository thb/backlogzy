# One-time import of a legacy backlogzy localStorage backup (format v1) into an
# account. Old ids are remapped to fresh UUIDs so the same file can be imported
# into several accounts without PK collisions.
#
#   payload = {
#     "projects"  => { "<old_id>" => { "name" => ..., "color" => ..., "position" => ... } },
#     "items"     => { "<old_id>" => { "project_id" => "<old_id>", "type" => "task", ... } },
#     "habits"    => { "2026-04-01" => ["🧘", "📖"] },          # optional
#     "pomodoros" => { "2026-04-01" => 3 }                      # optional
#   }
#
# Records exported straight from the old app's localStorage are wrapped by
# TanStack DB as { "versionKey" => uuid, "data" => {...} } — unwrapped here.
class ImportBackup
  Result = Struct.new(:projects, :items, :habits, :pomodoros, keyword_init: true)

  def self.call(account:, user:, payload:)
    new(account, user, payload).call
  end

  def initialize(account, user, payload)
    @account = account
    @user = user
    @payload = payload
  end

  def call
    ActiveRecord::Base.transaction do
      project_ids = import_projects
      Result.new(
        projects: project_ids.size,
        items: import_items(project_ids),
        habits: import_habits,
        pomodoros: import_pomodoros
      )
    end
  end

  private

  def unwrap(attrs)
    return attrs["data"] if attrs.is_a?(Hash) && attrs.key?("versionKey") && attrs["data"].is_a?(Hash)

    attrs
  end

  def import_projects
    (@payload["projects"] || {}).to_h do |key, attrs|
      attrs = unwrap(attrs)
      project = @account.projects.create!(
        name: attrs["name"].presence || "Untitled",
        color: Project::COLORS.include?(attrs["color"]) ? attrs["color"] : "gray",
        position: attrs["position"].to_f
      )
      # Items reference the record's own id; the dict key may be storage-encoded ("s:<id>").
      [attrs["id"] || key, project.id]
    end
  end

  def import_items(project_ids)
    (@payload["items"] || {}).count do |_old_id, attrs|
      attrs = unwrap(attrs)
      project_id = project_ids[attrs["project_id"]]
      next false unless project_id # orphan rows in old backups are skipped

      Item.create!(item_attrs(attrs).merge(project_id: project_id))
      true
    end
  end

  def item_attrs(attrs)
    kind = Item::KINDS.include?(attrs["type"]) ? attrs["type"] : "task"
    {
      kind: kind, position: attrs["position"].to_f,
      description: attrs["description"].to_s, label: attrs["label"].to_s,
      status: Item::STATUSES.include?(attrs["status"]) ? attrs["status"] : "TODO",
      estimation: attrs["estimation"], time_spent: attrs["time_spent"],
      notes: attrs["notes"].to_s, planned_start: attrs["planned_start"],
      planned_end: attrs["planned_end"], completed_at: attrs["completed_at"]
    }
  end

  def import_habits
    (@payload["habits"] || {}).sum do |date, emojis|
      Array(emojis).count do |emoji|
        entry = @account.habit_entries.where(user: @user)
                        .find_or_create_by!(date: date, emoji: emoji)
        entry.previously_new_record?
      end
    end
  end

  def import_pomodoros
    (@payload["pomodoros"] || {}).count do |date, count|
      next false if count.to_i <= 0

      record = @account.pomodoros.where(user: @user).find_or_initialize_by(date: date)
      record.update!(count: count.to_i)
      true
    end
  end
end
