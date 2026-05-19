# Tactic: Maven Project Compliance Setup

**Invoked by:**
- [Directive 041](../directives/041_use_regnology_branding.md) (Use Regnology Branding)

**Related tactics:**
- (Standalone — Maven-specific build configuration)

**Complements:**
- [Directive 036](../directives/036_boy_scout_rule.md) (Boy Scout Rule — apply when touching existing pom.xml files)

---

## Intent

Configure a Maven project to comply with Regnology PS standards for licensing, static analysis, and package identity. Covers the root `pom.xml` of a single- or multi-module reactor build.

Apply when:
- Creating a new Regnology PS Maven project
- Onboarding an existing Maven project into the Regnology PS ecosystem
- A Boy Scout check reveals missing license, Sonar, or organization metadata

## Preconditions

**Required inputs:**
- A Maven project with a root `pom.xml`
- The Sonar project key for the repository (format: `CONS-<project-name>`)
- License templates from `doctrine/templates/license/`

**Assumed context:**
- The Regnology SonarQube instance is at `https://sonar.regnology.net/`
- The project uses the `net.regnology.proservices` groupId
- Java 21+ with UTF-8 source encoding

**Exclusions (when NOT to use):**
- Non-Maven projects (Gradle, sbt, etc.)
- Open-source or externally distributed projects (different license applies)

## Execution Steps

### Step 1: Place the LICENSE file

Copy `doctrine/templates/license/LICENSE` to the repository root.

For multi-module builds, also place license metadata in a `META/license/` directory at the repository root:

```
project-root/
├── LICENSE
├── META/
│   └── license/
│       ├── LICENSE
│       ├── licenses.properties
│       └── regnology-internal.properties
├── pom.xml
└── ...
```

Source templates: `doctrine/templates/license/`

### Step 2: Configure root pom.xml identity and license

Add the organization, license, and inception year blocks to the root `pom.xml`:

```xml
<organization>
    <name>Regnology Group GmbH</name>
    <url>https://www.regnology.net</url>
</organization>

<licenses>
    <license>
        <name>regnology-internal</name>
        <url>file://META/license/LICENSE</url>
        <distribution>repo</distribution>
        <comments>Proprietary - All Rights Reserved - Internal Use Only</comments>
    </license>
</licenses>

<inceptionYear>YYYY</inceptionYear>
```

Replace `YYYY` with the project's inception year.

### Step 3: Declare plugin versions in properties

Add version properties for the compliance plugins in the root `<properties>` block. Use the latest stable versions available at the time of setup:

```xml
<properties>
    <!-- Java / encoding -->
    <java.version>21</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

    <!-- Sonar -->
    <sonar.host.url>https://sonar.regnology.net/</sonar.host.url>
    <sonar.projectKey>CONS-your-project-name</sonar.projectKey>
    <sonar.projectName>CONS/your-project-name</sonar.projectName>

    <!-- Plugin versions (check for latest) -->
    <sonar-maven-plugin.version>5.1.0.4751</sonar-maven-plugin.version>
    <jacoco-maven-plugin.version>0.8.14</jacoco-maven-plugin.version>
    <license-maven-plugin.version>2.5.0</license-maven-plugin.version>
    <cyclonedx-maven-plugin.version>2.9.1</cyclonedx-maven-plugin.version>
    <spotless-maven-plugin.version>3.2.1</spotless-maven-plugin.version>
</properties>
```

### Step 4: Configure pluginManagement in root pom.xml

Declare shared plugin configuration in `<build><pluginManagement>`:

```xml
<build>
    <pluginManagement>
        <plugins>
            <!-- Code coverage -->
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>${jacoco-maven-plugin.version}</version>
                <executions>
                    <execution>
                        <goals><goal>prepare-agent</goal></goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals><goal>report</goal></goals>
                    </execution>
                </executions>
            </plugin>

            <!-- Formatting -->
            <plugin>
                <groupId>com.diffplug.spotless</groupId>
                <artifactId>spotless-maven-plugin</artifactId>
                <version>${spotless-maven-plugin.version}</version>
                <configuration>
                    <java>
                        <googleJavaFormat/>
                        <indent>
                            <tabs>true</tabs>
                            <spacesPerTab>2</spacesPerTab>
                        </indent>
                    </java>
                </configuration>
            </plugin>

            <!-- Sonar -->
            <plugin>
                <groupId>org.sonarsource.scanner.maven</groupId>
                <artifactId>sonar-maven-plugin</artifactId>
                <version>${sonar-maven-plugin.version}</version>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

### Step 5: Add the compliance profile

Add a `compliance` Maven profile to the deployable module(s). This profile groups license header management, SBOM generation, and reporting. Activate it by default so compliance artifacts are always produced.

```xml
<profiles>
    <profile>
        <id>compliance</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <build>
            <plugins>
                <!-- License headers and third-party report -->
                <plugin>
                    <groupId>org.codehaus.mojo</groupId>
                    <artifactId>license-maven-plugin</artifactId>
                    <version>${license-maven-plugin.version}</version>
                    <configuration>
                        <licenseName>regnology-internal</licenseName>
                        <licenseResolver>file://${project.basedir}/../META/license</licenseResolver>
                        <addJavaLicenseAfterPackage>false</addJavaLicenseAfterPackage>
                        <outputDirectory>${project.basedir}/../output</outputDirectory>
                        <thirdPartyFilename>THIRD-PARTY.txt</thirdPartyFilename>
                        <roots>
                            <root>src/main/java</root>
                            <root>src/test/java</root>
                        </roots>
                        <includes>
                            <include>**/*.java</include>
                        </includes>
                    </configuration>
                    <executions>
                        <execution>
                            <id>add-third-party</id>
                            <phase>generate-resources</phase>
                            <goals><goal>add-third-party</goal></goals>
                        </execution>
                        <execution>
                            <id>update-file-header</id>
                            <phase>process-sources</phase>
                            <goals><goal>update-file-header</goal></goals>
                        </execution>
                        <execution>
                            <id>update-project-license</id>
                            <phase>generate-resources</phase>
                            <goals><goal>update-project-license</goal></goals>
                        </execution>
                    </executions>
                </plugin>

                <!-- CycloneDX SBOM -->
                <plugin>
                    <groupId>org.cyclonedx</groupId>
                    <artifactId>cyclonedx-maven-plugin</artifactId>
                    <version>${cyclonedx-maven-plugin.version}</version>
                    <executions>
                        <execution>
                            <id>generate-sbom</id>
                            <phase>package</phase>
                            <goals><goal>makeBom</goal></goals>
                            <configuration>
                                <outputName>bom</outputName>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

**Adjust `<licenseResolver>` path** if the module is not a direct child of the root (e.g., `../../META/license` for nested modules).

### Step 6: Bundle license into JAR artifacts

In each module that produces a JAR, add a resource entry to copy the license files into `META-INF/license`:

```xml
<build>
    <resources>
        <resource>
            <directory>src/main/resources</directory>
        </resource>
        <resource>
            <directory>../META/license</directory>
            <targetPath>META-INF/license</targetPath>
        </resource>
    </resources>
</build>
```

### Step 7: Create sonar-project.properties (optional)

For standalone SonarScanner CLI usage (outside Maven), create `sonar-project.properties` at the repository root:

```properties
sonar.projectKey=CONS-your-project-name
sonar.projectName=CONS/your-project-name

sonar.exclusions=\
  **/package-info.java

sonar.coverage.exclusions=\
  **/config/**,\
  **/*Exception.java
```

Adjust exclusions to match the project's conventions. The Maven `sonar-maven-plugin` reads its configuration from `pom.xml` properties (Step 3), not from this file.

### Step 8: Configure module-level Sonar exclusions

In child modules, override Sonar exclusion properties as needed:

```xml
<properties>
    <sonar.exclusions>**/package-info.java,**/SomeBootstrapClass.java</sonar.exclusions>
    <sonar.coverage.exclusions>**/config/**,**/cli/**,**/*Exception.java</sonar.coverage.exclusions>
</properties>
```

## Verification

After completing the steps above, verify:

1. **License in place:**
   ```bash
   test -f LICENSE && echo "OK" || echo "MISSING"
   test -f META/license/LICENSE && echo "OK" || echo "MISSING"
   ```

2. **Maven build succeeds:**
   ```bash
   mvn clean verify
   ```

3. **License headers applied to Java files:**
   ```bash
   head -5 src/main/java/**/*.java   # should show license comment block
   ```

4. **JaCoCo report generated:**
   ```bash
   ls target/site/jacoco/index.html
   ```

5. **SBOM generated:**
   ```bash
   ls target/bom.json
   ```

6. **Sonar analysis (requires network access):**
   ```bash
   mvn sonar:sonar
   ```

## Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `licenseResolver` not found | Relative path incorrect for module depth | Adjust `../../META/license` to match module's position relative to root |
| Sonar fails with 401 | Missing or expired Sonar token | Set `SONAR_TOKEN` env var or pass `-Dsonar.login=...` |
| SBOM plugin skipped | Profile not activated | Ensure `<activeByDefault>true</activeByDefault>` or pass `-Pcompliance` |
| Header not applied | `roots` configuration doesn't match source layout | Verify `<root>` entries point to actual source directories |

## Exit Criteria

- Root `pom.xml` contains `<organization>`, `<licenses>`, and `<inceptionYear>`
- Sonar properties (`projectKey`, `host.url`) are set
- `compliance` profile is present with license-maven-plugin and cyclonedx-maven-plugin
- `LICENSE` file exists at repository root
- `mvn clean verify` passes without errors
