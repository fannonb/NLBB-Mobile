package android.view;
public class Window {
  public int deprecatedCalls;
  public int argumentEvaluations;
  public int supportedCalls;
  public int argument() { argumentEvaluations++; return 7; }
  public void setStatusBarColor(int color) { deprecatedCalls++; }
  public void setNavigationBarColor(int color) { deprecatedCalls++; }
  public void setNavigationBarDividerColor(int color) { deprecatedCalls++; }
  public void setDecorFitsSystemWindows(boolean fits) { deprecatedCalls++; }
  public void setStatusBarContrastEnforced(boolean enforce) { deprecatedCalls++; }
  public int getStatusBarColor() { deprecatedCalls++; return 11; }
  public int getNavigationBarColor() { deprecatedCalls++; return 22; }
  public int getNavigationBarDividerColor() { deprecatedCalls++; return 33; }
  public void setNavigationBarContrastEnforced(boolean enforce) { supportedCalls++; }
}
