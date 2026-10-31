import javax.tools.ToolProvider
import org.objectweb.asm.ClassReader
import org.objectweb.asm.ClassWriter

// Shared by the Gradle preBuild gate and the standalone JVM test runner.
return { Class visitor, File fixtureDirectory, File out ->
    def compiler = ToolProvider.systemJavaCompiler
    if (compiler == null) throw new IllegalStateException('A full JDK is required')
    out.mkdirs()
    def args = ['-d', out.absolutePath]
    fixtureDirectory.eachFileRecurse { if (it.name.endsWith('.java')) args.add(it.absolutePath) }
    if (compiler.run(null, null, null, args as String[]) != 0) throw new IllegalStateException('Fixture compilation failed')
    File subject = new File(out, 'fixture/WindowCalls.class')
    def writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS)
    new ClassReader(subject.bytes).accept(visitor.getConstructor(org.objectweb.asm.ClassVisitor).newInstance(writer), ClassReader.EXPAND_FRAMES)
    subject.bytes = writer.toByteArray()
    def loader = new URLClassLoader([out.toURI().toURL()] as URL[], (ClassLoader) null)
    try {
        def sdk = loader.loadClass('android.os.Build$VERSION').getField('SDK_INT')
        def windowClass = loader.loadClass('android.view.Window')
        def calls = loader.loadClass('fixture.WindowCalls').getMethod('exercise', windowClass)
        [24, 29, 30, 34, 35, 36, 37].each { api ->
            sdk.setInt(null, api)
            def window = windowClass.getConstructor().newInstance()
            int value = (int) calls.invoke(null, window)
            int invoked = windowClass.getField('deprecatedCalls').getInt(window)
            assert invoked == (api < 35 ? 8 : 0): "API ${api} deprecated call count: ${invoked}"
            assert value == (api < 35 ? 66 : 0): "API ${api} getter result: ${value}"
            assert windowClass.getField('argumentEvaluations').getInt(window) == 5: 'Argument side effects were lost'
            assert windowClass.getField('supportedCalls').getInt(window) == 1: 'Supported contrast API was altered'
            ['plainSetter', 'plainGetter'].each { name ->
                try {
                    loader.loadClass('fixture.WindowCalls').getMethod(name, windowClass).invoke(null, [null] as Object[])
                    assert false: "${name} accepted a null Window on API ${api}"
                } catch (java.lang.reflect.InvocationTargetException error) {
                    assert error.cause instanceof NullPointerException
                }
            }
        }
    } finally { loader.close() }
}
