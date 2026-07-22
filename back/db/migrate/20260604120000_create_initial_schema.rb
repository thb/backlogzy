class CreateInitialSchema < ActiveRecord::Migration[8.0]
  def change
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    create_table :users, id: :uuid do |t|
      t.string :email, null: false
      t.string :name, null: false
      t.string :password_digest, null: false
      t.boolean :super_admin, null: false, default: false
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :accounts, id: :uuid do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.timestamps
    end
    add_index :accounts, :slug, unique: true

    create_table :account_memberships, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.string :role, null: false, default: "member"
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :account_memberships, %i[user_id account_id], unique: true

    create_table :projects, id: :uuid do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :color, null: false, default: "gray"
      t.float :position, null: false, default: 0
      t.timestamps
    end
    add_index :projects, %i[account_id position]

    create_table :items, id: :uuid do |t|
      t.references :project, null: false, foreign_key: true, type: :uuid
      t.string :kind, null: false, default: "task"
      t.text :description, null: false, default: ""
      t.string :label, null: false, default: ""
      t.string :status, null: false, default: "TODO"
      t.float :estimation
      t.float :time_spent
      t.text :notes, null: false, default: ""
      t.date :planned_start
      t.date :planned_end
      t.datetime :completed_at
      t.float :position, null: false, default: 0
      t.timestamps
    end
    add_index :items, %i[project_id position]
    add_index :items, :planned_start

    create_table :habit_entries, id: :uuid do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.date :date, null: false
      t.string :emoji, null: false
      t.timestamps
    end
    add_index :habit_entries, %i[account_id user_id date emoji], unique: true

    create_table :pomodoros, id: :uuid do |t|
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.date :date, null: false
      t.integer :count, null: false, default: 0
      t.timestamps
    end
    add_index :pomodoros, %i[account_id user_id date], unique: true
  end
end
