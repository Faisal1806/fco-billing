'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Shield, KeyRound, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';

const placeholderUsers = [
    { name: 'Firdous Ahmad Lone', email: 'firdous@fco.com', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=firdous' },
    { name: 'Faisal Lone', email: 'faisal@fco.com', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=faisal' },
    { name: 'John Doe', email: 'john@example.com', role: 'Manager', avatar: 'https://i.pravatar.cc/150?u=john' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'Staff', avatar: 'https://i.pravatar.cc/150?u=jane' },
];

const permissions = [
    { id: 'sales', label: 'Create & Edit Sales' },
    { id: 'purchases', label: 'Create & Edit Purchases' },
    { id: 'parties', label: 'Manage Parties' },
    { id: 'products', label: 'Manage Products' },
    { id: 'reports', label: 'View Reports' },
    { id: 'settings', label: 'Access Settings' },
    { id: 'delete', label: 'Delete Records' },
];

const RoleChip = ({ role }: { role: string }) => {
    const roleColors: {[key: string]: string} = {
        Admin: 'bg-red-500/80 border-red-400/50 text-white',
        Manager: 'bg-blue-500/80 border-blue-400/50 text-white',
        Staff: 'bg-green-500/80 border-green-400/50 text-white',
    };
    return (
        <motion.div
            whileHover={{ y: -2, scale: 1.1, boxShadow: '0px 5px 15px rgba(0,0,0,0.3)' }}
            className={`px-3 py-1 text-xs font-bold rounded-full shadow-md transition-all ${roleColors[role] || 'bg-gray-500'}`}
        >
            {role}
        </motion.div>
    )
}

const PermissionToggle = ({ permission }: { permission: { id: string, label: string }}) => {
    const [isChecked, setIsChecked] = React.useState(permission.id !== 'delete');
    return (
        <div className="flex items-center justify-between p-3 bg-card/60 border border-white/10 rounded-lg">
            <Label htmlFor={permission.id} className="font-medium">{permission.label}</Label>
            <div className="[transform-style:preserve-3d] hover:[transform:rotateX(15deg)] transition-transform">
                <Switch 
                    id={permission.id}
                    checked={isChecked}
                    onCheckedChange={setIsChecked}
                    className="shadow-inner-lg data-[state=checked]:bg-green-500"
                />
            </div>
        </div>
    )
}


export default function UsersAndRolesPage() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Users & Roles"
                description="Manage staff access and permissions for the application. (This is a placeholder UI)."
                icon={<UserCheck className="h-8 w-8" />}
                imageUrl="/assets/3d/users.png"
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Staff Members</CardTitle>
                            <Button size="sm" className="gap-2">
                                <PlusCircle className="h-4 w-4"/> Invite User
                            </Button>
                        </div>
                        <CardDescription>A list of all users with access to this app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {placeholderUsers.map(user => (
                            <motion.div
                                key={user.email}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50"
                                whileHover={{ scale: 1.03 }}
                            >
                                <Avatar>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <RoleChip role={user.role} />
                            </motion.div>
                        ))}
                    </CardContent>
                </Card>

                 <Card className="lg:col-span-2">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-3"><Shield className="h-6 w-6 text-yellow-400" /> Role Permissions</CardTitle>
                         <CardDescription>Define what different roles can see and do within the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                             <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><KeyRound className="h-5 w-5 text-red-400"/> Admin Permissions</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {permissions.map(p => <PermissionToggle key={p.id} permission={p} />)}
                             </div>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}



