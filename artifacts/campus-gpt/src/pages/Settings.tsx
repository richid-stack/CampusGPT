import { Settings as SettingsIcon, User } from 'lucide-react';
import { useGetUserProfile } from '@workspace/api-client-react';

export default function Settings() {
  const { data: profile, isLoading } = useGetUserProfile();

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-brand-500" />
          Settings
        </h1>
      </div>

      <div className="p-6 overflow-y-auto max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-card border border-border rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-card border border-border rounded animate-pulse" />
                <div className="h-4 w-48 bg-card border border-border rounded animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-md shrink-0">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {profile?.name ?? 'Your Name'}
                </h2>
                <p className="text-sm text-text-secondary">
                  {profile?.email ?? '—'}
                </p>
              </div>
            </div>

            {/* Academic profile */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">Academic Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Degree</label>
                  <div className="p-2.5 bg-sidebar border border-border rounded-lg text-sm text-text-primary font-medium min-h-[38px]">
                    {profile?.degree ?? <span className="text-text-tertiary">Not set</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Year of Study</label>
                  <div className="p-2.5 bg-sidebar border border-border rounded-lg text-sm text-text-primary font-medium min-h-[38px]">
                    {profile?.year ? `Year ${profile.year}` : <span className="text-text-tertiary">Not set</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Faculty</label>
                  <div className="p-2.5 bg-sidebar border border-border rounded-lg text-sm text-text-primary font-medium min-h-[38px]">
                    {profile?.faculty ?? <span className="text-text-tertiary">Not set</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Residence / Hall</label>
                  <div className="p-2.5 bg-sidebar border border-border rounded-lg text-sm text-text-primary font-medium min-h-[38px]">
                    {profile?.hall ?? <span className="text-text-tertiary">Not set</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Interests */}
            {(profile?.interests?.length ?? 0) > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">Interests & Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {profile!.interests!.map(interest => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-brand-50 border border-brand-500/20 text-brand-600 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border flex justify-end">
              <button className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
