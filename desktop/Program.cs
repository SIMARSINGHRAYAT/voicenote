using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace VoiceNoteDesktop;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new VoiceNoteForm());
    }
}

internal sealed class VoiceNoteForm : Form
{
    private const string AppUrl = "https://voicenote-mocha.vercel.app";
    private readonly WebView2 webView = new() { Dock = DockStyle.Fill };

    public VoiceNoteForm()
    {
        Text = "VOICE NOTE MEMO";
        Width = 1440;
        Height = 960;
        MinimumSize = new Size(960, 640);
        StartPosition = FormStartPosition.CenterScreen;
        Controls.Add(webView);
        Shown += LoadWebAppAsync;
    }

    private async void LoadWebAppAsync(object? sender, EventArgs e)
    {
        try
        {
            await webView.EnsureCoreWebView2Async();
            webView.CoreWebView2.PermissionRequested += HandlePermissionRequested;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.IsZoomControlEnabled = true;
            webView.CoreWebView2.Navigate(AppUrl);
        }
        catch (Exception error)
        {
            MessageBox.Show(
                $"Voice Note could not start. Install Microsoft Edge WebView2 Runtime and try again.\n\n{error.Message}",
                "VOICE NOTE MEMO",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private static void HandlePermissionRequested(object? sender, CoreWebView2PermissionRequestedEventArgs args)
    {
        if (args.PermissionKind == CoreWebView2PermissionKind.Microphone &&
            args.Uri.StartsWith("https://voicenote-mocha.vercel.app", StringComparison.OrdinalIgnoreCase))
        {
            args.State = CoreWebView2PermissionState.Allow;
        }
    }
}
