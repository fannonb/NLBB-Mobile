import org.objectweb.asm.ClassVisitor

File root = new File(args[0]).canonicalFile
String source = new File(root, 'plugins/android/window-api-guards.gradle').text
String visitor = source.substring(source.indexOf('class NlbbWindowApiClassVisitor'), source.indexOf('abstract class NlbbWindowApiVisitorFactory'))
def compiler = new GroovyClassLoader(this.class.classLoader)
Class implementation = compiler.parseClass('import org.objectweb.asm.*\n' + visitor)
def verify = new GroovyShell(this.class.classLoader).evaluate(new File(root, 'plugins/android/test-window-api-guards.groovy'))
verify(implementation, new File(root, 'plugins/android/fixtures'), new File(root, '.tmp/android-window-guard-tests'))
println('PASS: actual bytecode guards verified on API 24, 29, 30, 34, 35, 36, 37')
