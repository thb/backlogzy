class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications, id: :uuid do |t|
      t.references :account, type: :uuid, null: false, foreign_key: true
      t.references :recipient, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.references :actor, type: :uuid, null: true, foreign_key: { to_table: :users }
      t.references :notifiable, type: :uuid, polymorphic: true, null: true
      t.string :action, null: false
      t.jsonb :data, null: false, default: {}
      t.datetime :read_at
      t.timestamps
    end

    add_index :notifications, %i[recipient_id read_at]
    add_index :notifications, %i[recipient_id created_at]
  end
end
