import type { Role } from "./demo-accounts";
export type AdminAccount={id:string;name:string;email:string;role:Role;suspended:boolean;sessions:number;portfolioUpdatedAt:string|null;sharedWithFaculty:boolean;projects:number;achievements:number};
export type AdminActivity={id:string;actor:string;target:string;action:string;reason:string;createdAt:string};
export type AdminData={accounts:AdminAccount[];activity:AdminActivity[];metrics:{accounts:number;activeSessions:number;portfolios:number;sharedPortfolios:number;bookmarks:number;teamRequests:number};updatedAt:string};
