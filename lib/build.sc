import $file.semagrams.scala.build
import mill._
import mill.scalalib._
import mill.scalajslib._
import mill.scalajslib.api._
import scalafmt._

object app extends ScalaJSModule with ScalafmtModule {
  def scalaVersion = "3.2.2"
  def scalaJSVersion = "1.13.1"

  def scalacOptions = Seq("-deprecation", "-feature")

  def moduleKind = T { ModuleKind.ESModule }

  def moduleDeps = Seq(semagrams.scala.build.core)
  def artifactName = "app"
}
