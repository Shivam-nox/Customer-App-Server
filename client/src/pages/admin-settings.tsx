import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/loading-spinner";
import { ArrowLeft, Settings, Save, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminSettingsScreen() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingSettings, setEditingSettings] = useState<
    Record<string, string>
  >({});

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user && user.role === "admin",
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/category"] });
      toast({
        title: "Setting Updated",
        description: "The setting has been successfully updated.",
      });
      setEditingSettings({});
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    setLocation("/home");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const settings = (settingsData as any)?.settings || [];

  // Group settings by category
  const settingsByCategory = settings.reduce((acc: any, setting: any) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  const categories = Object.keys(settingsByCategory).sort();

  const handleEditSetting = (key: string, currentValue: string) => {
    setEditingSettings({ ...editingSettings, [key]: currentValue });
  };

  const handleSaveSetting = (key: string) => {
    const newValue = editingSettings[key];
    if (newValue !== undefined) {
      updateSettingMutation.mutate({ key, value: newValue });
    }
  };

  const handleCancelEdit = (key: string) => {
    const { [key]: removed, ...rest } = editingSettings;
    setEditingSettings(rest);
  };

  const formatCategoryName = (category: string) => {
    return (
      category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")
    );
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case "number":
        return "🔢";
      case "string":
        return "📝";
      case "boolean":
        return "✅";
      default:
        return "📄";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      data-testid="admin-settings-screen"
    >
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center space-x-2">
          <Settings size={20} />
          <h2 className="text-lg font-medium" data-testid="page-title">
            Admin Settings
          </h2>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Manage system-wide configuration settings. Changes affect all users
            immediately.
          </p>
        </div>

        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                data-testid={`tab-${category}`}
              >
                {formatCategoryName(category)}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-4">
                {settingsByCategory[category].map((setting: any) => (
                  <Card
                    key={setting.key}
                    data-testid={`setting-${setting.key}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center space-x-2">
                            <span>{getDataTypeIcon(setting.dataType)}</span>
                            <span>
                              {setting.key.replace(/_/g, " ").toUpperCase()}
                            </span>
                            {!setting.isEditable && (
                              <Lock size={14} className="text-gray-400" />
                            )}
                          </CardTitle>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {setting.dataType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {editingSettings[setting.key] !== undefined ? (
                          <div className="space-y-3">
                            <div>
                              <Label
                                htmlFor={`edit-${setting.key}`}
                                className="text-sm font-medium"
                              >
                                New Value
                              </Label>
                              <Input
                                id={`edit-${setting.key}`}
                                type={
                                  setting.dataType === "number"
                                    ? "number"
                                    : "text"
                                }
                                value={editingSettings[setting.key]}
                                onChange={(e) =>
                                  setEditingSettings({
                                    ...editingSettings,
                                    [setting.key]: e.target.value,
                                  })
                                }
                                className="mt-1"
                                data-testid={`input-${setting.key}`}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveSetting(setting.key)}
                                disabled={updateSettingMutation.isPending}
                                data-testid={`save-${setting.key}`}
                              >
                                <Save size={14} className="mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelEdit(setting.key)}
                                disabled={updateSettingMutation.isPending}
                                data-testid={`cancel-${setting.key}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-500">
                                Current Value:
                              </span>
                              <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                {setting.value}
                              </code>
                            </div>
                            {setting.isEditable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleEditSetting(setting.key, setting.value)
                                }
                                data-testid={`edit-${setting.key}`}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                        {setting.updatedAt && (
                          <p className="text-xs text-gray-400">
                            Last updated:{" "}
                            {new Date(setting.updatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
