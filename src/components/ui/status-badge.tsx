import * as React from "react"
import { Badge } from "./badge"
import { CheckCircle2, XCircle, AlertCircle, Archive } from "lucide-react"

export type StatusType = 
  | "GENERATED" 
  | "VOID" 
  | "CANCELLED" 
  | "ARCHIVED" 
  | "ACTIVE" 
  | "INACTIVE";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<StatusType, { variant: "success" | "destructive" | "warning" | "info" | "secondary", icon: React.ElementType }> = {
    GENERATED: { variant: "success", icon: CheckCircle2 },
    ACTIVE: { variant: "success", icon: CheckCircle2 },
    
    VOID: { variant: "destructive", icon: XCircle },
    CANCELLED: { variant: "destructive", icon: XCircle },
    INACTIVE: { variant: "destructive", icon: XCircle },
    
    
    ARCHIVED: { variant: "secondary", icon: Archive },
  };

  const { variant, icon: Icon } = config[status] || { variant: "secondary", icon: AlertCircle };

  return (
    <Badge variant={variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  )
}
