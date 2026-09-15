export type Role = 'master_admin'|'admin'|'moderator'|'user';
export type Profile = {id:string;username:string;display_name:string;creator_type:string;avatar_url:string|null;city:string|null;state:string|null;bio:string|null;is_suspended:boolean};
export type LiveRoom = {id:string;host_id:string;title:string;description?:string|null;cover_image_url?:string|null;livekit_room_name:string;viewer_count?:number;status:'scheduled'|'live'|'ended';started_at:string|null;ended_at:string|null};
