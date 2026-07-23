class AddArchivedAtToItems < ActiveRecord::Migration[8.0]
  def change
    add_column :items, :archived_at, :datetime
    add_index :items, :archived_at
  end
end
