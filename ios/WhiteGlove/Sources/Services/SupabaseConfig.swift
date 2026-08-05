import Foundation

enum SupabaseConfig {
    static let url = URL(string:
        ProcessInfo.processInfo.environment["SUPABASE_URL"]
        ?? "https://dvbxeemoiibkhufrntny.supabase.co"
    )!

    static let anonKey =
        ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
        ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YnhlZW1vaWlia2h1ZnJudG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDYxNDIsImV4cCI6MjEwMTQyMjE0Mn0.4d_QKyMXry8SIaH-h3obzIwDhGtfzVMxz89WVC1cU3E"
}
