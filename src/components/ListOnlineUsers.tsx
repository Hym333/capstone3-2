"use client";
import { useUser } from "@clerk/nextjs";
import { useSocket } from "../../context/SocketContext";
import Avatar from "./Avatar";

const ListOnlineUsers = () => {
  const { user } = useUser();
  const { onlineUsers } = useSocket();

  return (
    <div className="text-black flex mt-2 gap-4 border-b border-b-primary/10 w-full">
      {onlineUsers &&
        onlineUsers.map((onlineUser) => {
          return <div key={onlineUser.userId} className="flex flex-col items-center gap-1 cursor-pointer">
            <Avatar src={onlineUser.profile.imageUrl}/>
            <div className="text-sm">{onlineUser.profile.fullName?.split(' ')[0]}</div>
          </div>;
        })}
    </div>
  );
};

export default ListOnlineUsers;
