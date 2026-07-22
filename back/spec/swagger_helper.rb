# frozen_string_literal: true

require "rails_helper"

RSpec.configure do |config|
  config.openapi_root = Rails.root.join("swagger").to_s

  config.openapi_specs = {
    "v1/swagger.yaml" => {
      openapi: "3.0.1",
      info: {
        title: "Backlogzy API",
        version: "v1",
        description: "Golden-path API. Auth = Bearer JWT, multi-tenant = X-Account header."
      },
      paths: {},
      servers: [
        { url: "http://localhost:3000", description: "Local" }
      ],
      components: {
        securitySchemes: {
          bearer_auth: { type: :http, scheme: :bearer, bearerFormat: "JWT" },
          account_header: { type: :apiKey, name: "X-Account", in: :header }
        },
        schemas: {
          Project: {
            type: :object,
            properties: {
              id: { type: :string, format: :uuid },
              name: { type: :string },
              color: { type: :string },
              position: { type: :number },
              created_at: { type: :string, format: "date-time" },
              updated_at: { type: :string, format: "date-time" }
            },
            required: %w[id name color position]
          },
          Item: {
            type: :object,
            properties: {
              id: { type: :string, format: :uuid },
              project_id: { type: :string, format: :uuid },
              kind: { type: :string, enum: %w[task separator] },
              description: { type: :string },
              label: { type: :string },
              status: { type: :string, enum: %w[TODO IN_DESIGN IN_DEV IN_QA IN_PROD WAITING REDO] },
              estimation: { type: :number, nullable: true },
              time_spent: { type: :number, nullable: true },
              notes: { type: :string },
              planned_start: { type: :string, format: :date, nullable: true },
              planned_end: { type: :string, format: :date, nullable: true },
              completed_at: { type: :string, format: "date-time", nullable: true },
              position: { type: :number },
              created_at: { type: :string, format: "date-time" }
            },
            required: %w[id project_id kind position]
          },
          Notification: {
            type: :object,
            properties: {
              id: { type: :string, format: :uuid },
              action: { type: :string, enum: %w[member_added] },
              data: { type: :object, additionalProperties: { type: :string } },
              notifiable_type: { type: :string, nullable: true },
              notifiable_id: { type: :string, format: :uuid, nullable: true },
              actor_name: { type: :string, nullable: true },
              read: { type: :boolean },
              created_at: { type: :string, format: "date-time" }
            },
            required: %w[id action read]
          },
          ValidationErrors: {
            type: :object,
            properties: {
              errors: { type: :object, additionalProperties: { type: :array, items: { type: :string } } }
            }
          }
        }
      },
      security: [{ bearer_auth: [], account_header: [] }]
    }
  }

  config.openapi_format = :yaml
end
