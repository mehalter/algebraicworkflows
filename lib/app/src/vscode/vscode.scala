package vscode

import scala.scalajs.js
import scala.scalajs.js.annotation
import scala.scalajs.js.annotation.JSGlobalScope

trait CommandMessage extends js.Object {
  val command: String
}

class AlertMessage(val text: String) extends CommandMessage {
  val command = "alert"
}

@js.native
trait WebviewAPI extends js.Object {
  def postMessage(message: CommandMessage): Unit
  def getState(): js.Any
  def setState(newState: js.Any): Unit
}

@js.native
@JSGlobalScope
object Globals extends js.Object {
  def acquireVsCodeApi(): WebviewAPI = js.native
}
