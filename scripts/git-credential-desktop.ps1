param([string]$action)

if ($action -eq "get") {
    $code = @'
    using System;
    using System.Runtime.InteropServices;
    public class WinCredHelper {
        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
        [DllImport("advapi32.dll", SetLastError = true)]
        public static extern void CredFree(IntPtr credentialPtr);
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct CREDENTIAL {
            public int Flags;
            public int Type;
            public string TargetName;
            public string Comment;
            public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
            public int CredentialBlobSize;
            public IntPtr CredentialBlob;
            public int Persist;
            public int AttributeCount;
            public IntPtr Attributes;
            public string TargetAlias;
            public string UserName;
        }
        public static string ReadGenericSecret(string target) {
            IntPtr ptr;
            if (CredRead(target, 1, 0, out ptr)) {
                var cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
                byte[] blob = new byte[cred.CredentialBlobSize];
                Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                CredFree(ptr);
                string secret = System.Text.Encoding.UTF8.GetString(blob);
                if (secret.Contains("\0")) {
                    secret = System.Text.Encoding.Unicode.GetString(blob);
                }
                return secret;
            }
            return null;
        }
    }
'@
    if (-not ([System.Management.Automation.PSTypeName]'WinCredHelper').Type) {
        Add-Type -TypeDefinition $code
    }
    $token = [WinCredHelper]::ReadGenericSecret('GitHub - https://api.github.com/Blutmann')
    if ($token) {
        [Console]::Out.WriteLine("username=x-access-token")
        [Console]::Out.WriteLine("password=$token")
    }
}
