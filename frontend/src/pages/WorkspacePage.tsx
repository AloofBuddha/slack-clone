import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChannelStore } from '../stores/channelStore';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';
import ChannelView from '../components/workspace/ChannelView';
import WorkspaceSelector from '../components/workspace/WorkspaceSelector';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, fetchWorkspace, fetchWorkspaces, workspaces } = useWorkspaceStore();
  const { currentChannel, fetchChannels, channels } = useChannelStore();
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchWorkspaces();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchWorkspaces]);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (workspaceId) {
        try {
          await fetchWorkspace(workspaceId);
          await fetchChannels(workspaceId);
        } catch (error) {
          console.error('Failed to load workspace:', error);
        }
      }
    };
    loadWorkspace();
  }, [workspaceId, fetchWorkspace, fetchChannels]);

  // Redirect to first workspace if on /workspace without an ID
  useEffect(() => {
    if (workspaceId) {
      // Reset redirect flag when we have a workspaceId
      hasRedirected.current = false;
    } else if (!isLoading && workspaces.length > 0 && !hasRedirected.current) {
      // Only redirect once
      hasRedirected.current = true;
      const firstWorkspace = workspaces[0];
      navigate(`/workspace/${firstWorkspace.id}`, { replace: true });
    }
  }, [workspaceId, isLoading, workspaces, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspaces.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No workspaces found</h2>
          <p className="text-gray-600 mb-6">
            You're not part of any workspace yet. Create your first workspace to get started.
          </p>
          <WorkspaceSelector />
        </div>
      </div>
    );
  }

  if (workspaceId && !currentWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Workspace Sidebar */}
      <WorkspaceSidebar />

      {/* Main Content */}
      <div className="flex flex-1">
        {currentChannel ? (
          <ChannelView />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">
                {channels.length > 0 ? 'Select a channel to start messaging' : 'No channels available'}
              </h2>
              {channels.length === 0 && (
                <p className="mt-2 text-gray-500">Create a channel to begin collaboration</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
