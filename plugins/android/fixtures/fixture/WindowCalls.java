package fixture;
import android.view.Window;
public class WindowCalls {
  public static void plainSetter(Window window) { window.setStatusBarColor(123); }
  public static int plainGetter(Window window) { return window.getStatusBarColor(); }
  public static int exercise(Window window) {
    window.setStatusBarColor(window.argument());
    window.setNavigationBarColor(window.argument());
    window.setNavigationBarDividerColor(window.argument());
    window.setDecorFitsSystemWindows(window.argument() != 0);
    window.setStatusBarContrastEnforced(window.argument() != 0);
    window.setNavigationBarContrastEnforced(true);
    return window.getStatusBarColor() + window.getNavigationBarColor() + window.getNavigationBarDividerColor();
  }
}
