import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';

export default function WorkspaceSelector() {
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, createWorkspace } = useWorkspaceStore();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showList, setShowList] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspace(name, description);
      console.log('Created workspace:', workspace);
      
      if (!workspace?.id) {
        throw new Error('Workspace created but no ID returned');
      }
      
      toast({
        title: 'Success',
        description: 'Workspace created successfully',
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      navigate(`/workspace/${workspace.id}`);
    } catch (error: any) {
      console.error('Workspace creation error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to create workspace',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`);
    setShowList(false);
  };

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setShowList(!showList)}
          className="flex items-center space-x-2 text-white hover:bg-white/10 rounded px-2 py-1 flex-1"
        >
          <span className="font-bold truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="p-1.5 hover:bg-white/10 rounded ml-2"
          title="Create workspace"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Workspace List Dialog */}
      <Dialog open={showList} onOpenChange={setShowList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Workspace</DialogTitle>
            <DialogDescription>Select a workspace to switch to</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace.id)}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <h3 className="font-semibold">{workspace.name}</h3>
                {workspace.description && (
                  <p className="text-sm text-muted-foreground mt-1">{workspace.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {workspace._count?.members || 0} members · {workspace._count?.channels || 0} channels
                </p>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create New Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to collaborate with your team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workspace-name">Workspace Name *</Label>
                <Input
                  id="workspace-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Inc."
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="workspace-description">Description (optional)</Label>
                <Input
                  id="workspace-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A workspace for..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !name.trim()}>
                {isCreating ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
