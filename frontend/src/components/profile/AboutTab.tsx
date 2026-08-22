import React from 'react';
import { EmployeeProfile } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function AboutTab({ employee }: { employee: EmployeeProfile }) {
  const { user } = useAuthStore();
  const isSelfOrAdmin = user?.id === employee.user_id || user?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">About</h3>
        <p className="text-sm text-foreground/80 whitespace-pre-line">
          {employee.about || "No description provided."}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-foreground">Skills</h3>
          {isSelfOrAdmin && (
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Add Skills
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {employee.skills ? (
            employee.skills.split(',').map((skill, index) => (
              <Badge key={index} variant="secondary" className="font-normal text-sm">
                {skill.trim()}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No skills listed</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Certification</h3>
        <p className="text-sm text-foreground/80">
          {employee.certifications || "No certifications listed."}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">What I love about my job</h3>
        <p className="text-sm text-foreground/80">
          {employee.interests || "Not specified."}
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">My interests and hobbies</h3>
        <p className="text-sm text-foreground/80">
          {employee.interests || "Not specified."}
        </p>
      </div>
    </div>
  );
}
