"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus } from "./KanbanBoard";
import { 
  X, 
  Calendar, 
  User, 
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle, 
  AlignLeft,
  Tag,
  ChevronDown,
  UserCheck,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject, ProjectMember } from "@/app/contexts/ProjectContext";
import { useUsers } from "@/app/contexts/UserContext";
import { useAuth } from "@/app/contexts/AuthContext";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id">) => void;
  projectId: string | null;
}

export function AddTaskDialog({ isOpen, onClose, onAddTask, projectId }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showMembersList, setShowMembersList] = useState(false);
  
  // Get projects and members from context
  const { projects, currentProject } = useProject();
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  
  // Get users from context
  const { users } = useUsers();

  // 인증 컨텍스트에서 현재 사용자 정보 가져오기
  const { user: currentUser } = useAuth();
  
  // 현재 사용자가 이미 프로젝트 멤버인지 확인하기 위한 상태
  const [isCurrentUserInMembers, setIsCurrentUserInMembers] = useState(false);
  
  // Find the current project and its members
  useEffect(() => {
    if (!projectId) {
      setProjectMembers([]);
      setIsCurrentUserInMembers(false);
      return;
    }
    
    const project = projects.find(p => p.id === projectId) || currentProject;
    if (project) {
      // Filter for accepted members only
      const acceptedMembers = project.members.filter(
        member => member.inviteStatus === "accepted"
      );
      setProjectMembers(acceptedMembers);
      
      // 현재 사용자가 이미 프로젝트 멤버인지 확인
      if (currentUser) {
        setIsCurrentUserInMembers(
          acceptedMembers.some(member => member.userId === currentUser.id)
        );
      }
    } else {
      setProjectMembers([]);
      setIsCurrentUserInMembers(false);
    }
  }, [projectId, projects, currentProject, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 제목이 비어있으면 제출하지 않음
    if (!title.trim()) return;
    
    onAddTask({
      title,
      description,
      status,
      priority,
      assignee: assignee || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    
    // 폼 초기화 (제목만 초기화하고 다른 필드는 유지)
    setTitle("");
    
    // 대화상자는 닫지 않고 유지
    // onClose();
  };

  // 엔터키 핸들러 추가
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    // 폼 초기화
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setAssignee("");
    setDueDate("");
    
    onClose();
  };

  const getPriorityConfig = (priorityValue: string) => {
    switch (priorityValue) {
      case 'high':
        return {
          icon: <ArrowUp className="h-4 w-4 text-red-600" />,
          label: "높음",
          classes: "text-red-600 bg-red-50 border-red-200"
        };
      case 'medium':
        return {
          icon: <Minus className="h-4 w-4 text-yellow-600" />,
          label: "중간",
          classes: "text-yellow-600 bg-yellow-50 border-yellow-200"
        };
      case 'low':
        return {
          icon: <ArrowDown className="h-4 w-4 text-green-600" />,
          label: "낮음",
          classes: "text-green-600 bg-green-50 border-green-200"
        };
      default:
        return {
          icon: <Minus className="h-4 w-4 text-yellow-600" />,
          label: "중간",
          classes: "text-yellow-600 bg-yellow-50 border-yellow-200"
        };
    }
  };

  const getStatusConfig = (statusValue: string) => {
    switch (statusValue) {
      case 'todo':
        return {
          label: "할 일",
          classes: "text-gray-700 bg-gray-50 border-gray-200"
        };
      case 'in-progress':
        return {
          label: "진행 중",
          classes: "text-blue-700 bg-blue-50 border-blue-200"
        };
      case 'review':
        return {
          label: "검토",
          classes: "text-purple-700 bg-purple-50 border-purple-200"
        };
      case 'done':
        return {
          label: "완료",
          classes: "text-green-700 bg-green-50 border-green-200"
        };
      default:
        return {
          label: "할 일",
          classes: "text-gray-700 bg-gray-50 border-gray-200"
        };
    }
  };

  // Get assignee name from members
  const getAssigneeName = () => {
    if (!assignee) return "";
    
    // 먼저 프로젝트 멤버에서 찾기 (즉시 표시)
    const member = projectMembers.find(m => m.userId === assignee);
    if (member && member.user) {
      return member.user.name;
    }
    
    // 컨텍스트의 users에서 찾기
    const assigneeUser = users[assignee];
    if (assigneeUser) {
      return assigneeUser.name;
    }
    
    // 위 두 방법으로 찾지 못했을 경우 빈 문자열 반환
    return "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-600" />
            새 작업 추가
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* 제목 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                제목 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="작업 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* 설명 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="작업 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 상태 설정 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">상태</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none pr-8"
                  >
                    <option value="todo">할 일</option>
                    <option value="in-progress">진행 중</option>
                    <option value="review">검토</option>
                    <option value="done">완료</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className={`mt-2 text-xs flex items-center px-2 py-1 rounded-full ${getStatusConfig(status).classes} w-fit`}>
                  {getStatusConfig(status).label}
                </div>
              </div>

              {/* 우선순위 설정 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">우선순위</label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none pr-8"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 담당자 선택 드롭다운 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <UserCheck className="h-4 w-4 mr-1" />
                  담당자
                </label>
                <div className="relative">
                  <div 
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:border-blue-500 outline-none cursor-pointer flex justify-between items-center"
                    onClick={() => setShowMembersList(!showMembersList)}
                  >
                    <div className="flex items-center">
                      {assignee ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                            {getAssigneeName() ? getAssigneeName().charAt(0) : ""}
                          </div>
                          <span>{getAssigneeName()}</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-500">담당자를 선택하세요</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  {/* 드롭다운 멤버 목록 */}
                  {showMembersList && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                      {/* Unassigned option */}
                      <div 
                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${!assignee ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setAssignee("");
                          setShowMembersList(false);
                        }}
                      >
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span>담당자 없음</span>
                      </div>
                      
                      {/* 현재 로그인한 사용자(본인)를 목록에 추가 */}
                      {currentUser && !isCurrentUserInMembers && (
                        <div 
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${assignee === currentUser.id ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            setAssignee(currentUser.id);
                            setShowMembersList(false);
                          }}
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                            {currentUser.name.charAt(0)}
                          </div>
                          <span>{currentUser.name} (나)</span>
                        </div>
                      )}
                      
                      {projectMembers.length > 0 ? (
                        projectMembers.map((member) => (
                          <div 
                            key={member.userId}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${assignee === member.userId ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              setAssignee(member.userId);
                              setShowMembersList(false);
                            }}
                          >
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                              {member.user.name.charAt(0)}
                            </div>
                            <span>{member.user.name} {currentUser && member.userId === currentUser.id ? '(나)' : ''}</span>
                            {member.role === "owner" && (
                              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">소유자</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          {projectId ? "초대된 멤버가 없습니다" : "프로젝트를 선택해주세요"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 마감일 입력 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  마감일
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-white hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              작업 추가
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 