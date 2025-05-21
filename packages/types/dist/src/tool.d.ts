export interface Tool {
    id?: string;
    name: string;
    description?: string;
    businessId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isRequested?: boolean;
    status?: 'PENDING' | 'GRANTED' | 'DENIED';
    isConfigured?: boolean;
    icon?: string;
    requiredEnvVars?: string[];
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
