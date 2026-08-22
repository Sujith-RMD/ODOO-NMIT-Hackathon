import React from 'react';
import { Link } from 'react-router-dom';
import { EmployeeCard as EmployeeCardType } from '../../types';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { StatusDot } from './StatusDot';
import { Briefcase, Building2 } from 'lucide-react';

interface EmployeeCardProps {
  employee: EmployeeCardType;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  // Generate a random but consistent gradient based on the employee's ID for their cover photo
  const gradients = [
    'from-blue-500 to-indigo-500',
    'from-emerald-400 to-cyan-500',
    'from-amber-400 to-orange-500',
    'from-fuchsia-500 to-pink-500',
    'from-violet-500 to-purple-500',
  ];
  const gradientClass = gradients[employee.id % gradients.length];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link to={`/employees/${employee.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl h-full">
        <div className="bg-card hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border border-border/60 flex flex-col h-full group relative">
          
          {/* Cover Header */}
          <div className={`h-20 w-full bg-gradient-to-r ${gradientClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
          
          {/* Status Badge */}
          <div className="absolute top-2.5 right-2.5 shadow-sm bg-card/80 backdrop-blur-sm rounded-full z-10">
            <StatusDot status={employee.status} />
          </div>

          <div className="px-5 pb-5 pt-0 flex flex-col items-center flex-1">
            {/* Avatar overlapping the cover */}
            <Avatar className="h-20 w-20 border-4 border-card bg-card shadow-sm -mt-10 mb-3 transition-transform group-hover:scale-105 z-20">
              <AvatarImage src={employee.avatar_url || ''} alt={employee.full_name} className="object-cover" />
              <AvatarFallback className="text-xl font-bold bg-secondary text-secondary-foreground">
                {employee.initials}
              </AvatarFallback>
            </Avatar>
            
            <h3 className="font-bold text-foreground text-base tracking-tight mb-1 truncate w-full text-center group-hover:text-primary transition-colors">
              {employee.full_name}
            </h3>
            
            <p className="text-sm font-medium text-muted-foreground truncate w-full text-center flex items-center justify-center gap-1.5 mb-1.5">
              <Briefcase className="h-3.5 w-3.5 opacity-70" />
              {employee.position || 'No Position'}
            </p>
            
            <div className="mt-auto pt-4 flex items-center justify-center w-full">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/50 border border-secondary text-secondary-foreground text-xs font-semibold rounded-full truncate max-w-full">
                <Building2 className="h-3 w-3 opacity-70" />
                {employee.department || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
