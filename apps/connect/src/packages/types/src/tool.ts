export interface Tool {
  name: string;
  description: string;
  isConfigured: boolean;
  icon: string;
  requiredEnvVars: string[];
}

export interface ToolConfiguration {
  toolName: string;
  configuration: Record<string, any>;
}

export interface ToolConnection {
  id: string;
  businessId: string;
  toolName: string;
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
} 