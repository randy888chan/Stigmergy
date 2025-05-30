#!/usr/bin/env python3
"""
BMAD Memory Integration Wrapper

Provides seamless integration with OpenMemory MCP system with graceful fallback
when memory system is not available. This wrapper is used by orchestrator
components to maintain memory-enhanced functionality.

Usage:
    from memory_integration_wrapper import MemoryWrapper
    memory = MemoryWrapper()
    memory.add_decision_memory(decision_data)
    insights = memory.get_proactive_insights(context)
"""

import json
import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

class MemoryWrapper:
    """Wrapper for OpenMemory MCP integration with graceful fallback."""
    
    def __init__(self):
        self.memory_available = False
        self.memory_functions = {}
        self.fallback_storage = Path('.ai/memory-fallback.json')
        self._initialize_memory_system()
    
    def _initialize_memory_system(self):
        """Initialize memory system connections."""
        try:
            # Try to import OpenMemory MCP functions
            try:
                # This would be the actual import when OpenMemory MCP is available
                # from openmemory_mcp import add_memories, search_memory, list_memories
                # self.memory_functions = {
                #     'add_memories': add_memories,
                #     'search_memory': search_memory,
                #     'list_memories': list_memories
                # }
                # self.memory_available = True
                # logger.info("OpenMemory MCP initialized successfully")
                
                # For now, check if functions are available via other means
                self.memory_available = hasattr(self, '_check_memory_availability')
                
            except ImportError:
                logger.info("OpenMemory MCP not available, using fallback storage")
                self._initialize_fallback_storage()
                
        except Exception as e:
            logger.warning(f"Memory system initialization failed: {e}")
            self._initialize_fallback_storage()
    
    def _initialize_fallback_storage(self):
        """Initialize fallback JSON storage for when memory system is unavailable."""
        if not self.fallback_storage.exists():
            initial_data = {
                "memories": [],
                "patterns": [],
                "preferences": {},
                "decisions": [],
                "insights": [],
                "created": datetime.now(timezone.utc).isoformat()
            }
            with open(self.fallback_storage, 'w') as f:
                json.dump(initial_data, f, indent=2)
            logger.info(f"Initialized fallback storage: {self.fallback_storage}")
    
    def _load_fallback_data(self) -> Dict[str, Any]:
        """Load data from fallback storage."""
        try:
            if self.fallback_storage.exists():
                with open(self.fallback_storage, 'r') as f:
                    return json.load(f)
            else:
                self._initialize_fallback_storage()
                return self._load_fallback_data()
        except Exception as e:
            logger.error(f"Failed to load fallback data: {e}")
            return {"memories": [], "patterns": [], "preferences": {}, "decisions": [], "insights": []}
    
    def _save_fallback_data(self, data: Dict[str, Any]):
        """Save data to fallback storage."""
        try:
            data["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.fallback_storage, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save fallback data: {e}")
    
    def add_memory(self, content: str, tags: List[str] = None, metadata: Dict[str, Any] = None) -> bool:
        """Add a memory entry with automatic categorization."""
        if tags is None:
            tags = []
        if metadata is None:
            metadata = {}
            
        try:
            if self.memory_available and 'add_memories' in self.memory_functions:
                # Use OpenMemory MCP
                self.memory_functions['add_memories'](
                    content=content,
                    tags=tags,
                    metadata=metadata
                )
                return True
            else:
                # Use fallback storage
                data = self._load_fallback_data()
                memory_entry = {
                    "id": f"mem_{len(data['memories'])}_{int(datetime.now().timestamp())}",
                    "content": content,
                    "tags": tags,
                    "metadata": metadata,
                    "created": datetime.now(timezone.utc).isoformat()
                }
                data["memories"].append(memory_entry)
                self._save_fallback_data(data)
                return True
                
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")
            return False
    
    def search_memories(self, query: str, limit: int = 10, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search memories with semantic similarity."""
        try:
            if self.memory_available and 'search_memory' in self.memory_functions:
                # Use OpenMemory MCP
                return self.memory_functions['search_memory'](
                    query=query,
                    limit=limit,
                    threshold=threshold
                )
            else:
                # Use fallback with simple text matching
                data = self._load_fallback_data()
                results = []
                query_lower = query.lower()
                
                for memory in data["memories"]:
                    content_lower = memory["content"].lower()
                    # Simple keyword matching for fallback
                    if any(word in content_lower for word in query_lower.split()):
                        results.append({
                            "id": memory["id"],
                            "memory": memory["content"],
                            "tags": memory.get("tags", []),
                            "created_at": memory["created"],
                            "score": 0.8  # Default similarity score
                        })
                        
                return results[:limit]
                
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            return []
    
    def add_decision_memory(self, decision_data: Dict[str, Any]) -> bool:
        """Add a decision to decision archaeology with memory integration."""
        try:
            content = json.dumps(decision_data)
            tags = ["decision", decision_data.get("persona", "unknown"), "archaeology"]
            metadata = {
                "type": "decision",
                "project": decision_data.get("project", "unknown"),
                "confidence": decision_data.get("confidence_level", 50)
            }
            
            return self.add_memory(content, tags, metadata)
            
        except Exception as e:
            logger.error(f"Failed to add decision memory: {e}")
            return False
    
    def add_pattern_memory(self, pattern_data: Dict[str, Any]) -> bool:
        """Add a workflow or decision pattern to memory."""
        try:
            content = json.dumps(pattern_data)
            tags = ["pattern", pattern_data.get("pattern_type", "workflow"), "bmad-intelligence"]
            metadata = {
                "type": "pattern",
                "effectiveness": pattern_data.get("effectiveness_score", 0.5),
                "frequency": pattern_data.get("frequency", 1)
            }
            
            return self.add_memory(content, tags, metadata)
            
        except Exception as e:
            logger.error(f"Failed to add pattern memory: {e}")
            return False
    
    def add_user_preference(self, preference_data: Dict[str, Any]) -> bool:
        """Add user preference to memory for personalization."""
        try:
            content = json.dumps(preference_data)
            tags = ["user-preference", "personalization", "workflow-optimization"]
            metadata = {
                "type": "preference",
                "confidence": preference_data.get("confidence", 0.7)
            }
            
            return self.add_memory(content, tags, metadata)
            
        except Exception as e:
            logger.error(f"Failed to add user preference: {e}")
            return False
    
    def get_proactive_insights(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate proactive insights based on current context and memory patterns."""
        insights = []
        
        try:
            # Current context extraction
            persona = context.get("active_persona", "unknown")
            phase = context.get("current_phase", "unknown")
            task = context.get("current_task", "")
            
            # Search for relevant lessons learned
            lesson_query = f"lessons learned {persona} {phase} mistakes avoid"
            lesson_memories = self.search_memories(lesson_query, limit=5, threshold=0.6)
            
            for memory in lesson_memories:
                insights.append({
                    "type": "proactive-warning",
                    "insight": f"💡 Memory Insight: {memory.get('memory', '')[:150]}...",
                    "confidence": 0.8,
                    "source": "memory-intelligence",
                    "context": f"{persona}-{phase}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            # Search for optimization opportunities
            optimization_query = f"optimization {phase} improvement efficiency {persona}"
            optimization_memories = self.search_memories(optimization_query, limit=3, threshold=0.7)
            
            for memory in optimization_memories:
                insights.append({
                    "type": "optimization-opportunity", 
                    "insight": f"🚀 Optimization: {memory.get('memory', '')[:150]}...",
                    "confidence": 0.75,
                    "source": "memory-analysis",
                    "context": f"optimization-{phase}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            # Search for successful patterns
            pattern_query = f"successful pattern {persona} {phase} effective approach"
            pattern_memories = self.search_memories(pattern_query, limit=3, threshold=0.7)
            
            for memory in pattern_memories:
                insights.append({
                    "type": "success-pattern",
                    "insight": f"✅ Success Pattern: {memory.get('memory', '')[:150]}...",
                    "confidence": 0.85,
                    "source": "pattern-recognition",
                    "context": f"pattern-{phase}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
        except Exception as e:
            logger.error(f"Failed to generate proactive insights: {e}")
            
        return insights[:8]  # Limit to top 8 insights
    
    def get_memory_status(self) -> Dict[str, Any]:
        """Get current memory system status and metrics."""
        status = {
            "provider": "openmemory-mcp" if self.memory_available else "fallback-storage",
            "status": "connected" if self.memory_available else "offline",
            "capabilities": {
                "semantic_search": self.memory_available,
                "pattern_recognition": True,
                "proactive_insights": True,
                "decision_archaeology": True
            },
            "last_check": datetime.now(timezone.utc).isoformat()
        }
        
        # Add fallback storage stats if using fallback
        if not self.memory_available:
            try:
                data = self._load_fallback_data()
                status["fallback_stats"] = {
                    "total_memories": len(data.get("memories", [])),
                    "decisions": len(data.get("decisions", [])),
                    "patterns": len(data.get("patterns", [])),
                    "storage_file": str(self.fallback_storage)
                }
            except Exception as e:
                logger.error(f"Failed to get fallback stats: {e}")
                
        return status
    
    def sync_with_orchestrator_state(self, state_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sync memory data with orchestrator state and return updated intelligence."""
        sync_results = {
            "memories_synced": 0,
            "patterns_updated": 0,
            "insights_generated": 0,
            "status": "success"
        }
        
        try:
            # Sync decisions from state to memory
            decision_archaeology = state_data.get("decision_archaeology", {})
            for decision in decision_archaeology.get("major_decisions", []):
                if self.add_decision_memory(decision):
                    sync_results["memories_synced"] += 1
            
            # Update memory intelligence state
            memory_state = state_data.get("memory_intelligence_state", {})
            memory_state["memory_provider"] = "openmemory-mcp" if self.memory_available else "fallback-storage"
            memory_state["memory_status"] = "connected" if self.memory_available else "offline"
            memory_state["last_memory_sync"] = datetime.now(timezone.utc).isoformat()
            
            # Generate and update proactive insights
            current_context = {
                "active_persona": state_data.get("active_workflow_context", {}).get("current_state", {}).get("active_persona"),
                "current_phase": state_data.get("active_workflow_context", {}).get("current_state", {}).get("current_phase"),
                "current_task": state_data.get("active_workflow_context", {}).get("current_state", {}).get("last_task")
            }
            
            insights = self.get_proactive_insights(current_context)
            sync_results["insights_generated"] = len(insights)
            
            # Update proactive intelligence in state
            if "proactive_intelligence" not in memory_state:
                memory_state["proactive_intelligence"] = {}
                
            memory_state["proactive_intelligence"].update({
                "insights_generated": len(insights),
                "recommendations_active": len([i for i in insights if i["type"] == "optimization-opportunity"]),
                "warnings_issued": len([i for i in insights if i["type"] == "proactive-warning"]),
                "patterns_recognized": len([i for i in insights if i["type"] == "success-pattern"]),
                "last_update": datetime.now(timezone.utc).isoformat()
            })
            
            # Add insights to recent activity log
            activity_log = state_data.get("recent_activity_log", {})
            if "insight_generation" not in activity_log:
                activity_log["insight_generation"] = []
            
            for insight in insights:
                activity_log["insight_generation"].append({
                    "timestamp": insight["timestamp"],
                    "insight_type": insight["type"],
                    "insight": insight["insight"],
                    "confidence": insight["confidence"],
                    "applied": False,
                    "effectiveness": 0
                })
            
            # Keep only recent insights (last 10)
            activity_log["insight_generation"] = activity_log["insight_generation"][-10:]
            
        except Exception as e:
            sync_results["status"] = "error"
            sync_results["error"] = str(e)
            logger.error(f"Memory sync failed: {e}")
            
        return sync_results
    
    def get_contextual_briefing(self, target_persona: str, current_context: Dict[str, Any]) -> str:
        """Generate memory-enhanced contextual briefing for persona activation."""
        try:
            # Search for persona-specific patterns and lessons
            persona_query = f"{target_persona} successful approach effective patterns"
            persona_memories = self.search_memories(persona_query, limit=3, threshold=0.7)
            
            # Get current phase context
            current_phase = current_context.get("current_phase", "unknown")
            phase_query = f"{target_persona} {current_phase} lessons learned best practices"
            phase_memories = self.search_memories(phase_query, limit=3, threshold=0.6)
            
            # Generate briefing
            briefing = f"""
# 🧠 Memory-Enhanced Context for {target_persona}

## Your Relevant Experience
"""
            
            if persona_memories:
                briefing += "**From Similar Situations**:\n"
                for memory in persona_memories[:2]:
                    briefing += f"- {memory.get('memory', '')[:100]}...\n"
            
            if phase_memories:
                briefing += f"\n**For {current_phase} Phase**:\n"
                for memory in phase_memories[:2]:
                    briefing += f"- {memory.get('memory', '')[:100]}...\n"
            
            # Add proactive insights
            insights = self.get_proactive_insights(current_context)
            if insights:
                briefing += "\n## 💡 Proactive Intelligence\n"
                for insight in insights[:3]:
                    briefing += f"- {insight['insight']}\n"
            
            briefing += "\n---\n💬 **Memory Query**: Use `/recall <query>` for specific memory searches\n"
            
            return briefing
            
        except Exception as e:
            logger.error(f"Failed to generate contextual briefing: {e}")
            return f"# Context for {target_persona}\n\nMemory system temporarily unavailable. Proceeding with standard context."

# Global memory wrapper instance
memory_wrapper = MemoryWrapper()

# Convenience functions for easy import
def add_memory(content: str, tags: List[str] = None, metadata: Dict[str, Any] = None) -> bool:
    """Add a memory entry."""
    return memory_wrapper.add_memory(content, tags, metadata)

def search_memories(query: str, limit: int = 10, threshold: float = 0.7) -> List[Dict[str, Any]]:
    """Search memories."""
    return memory_wrapper.search_memories(query, limit, threshold)

def get_proactive_insights(context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get proactive insights."""
    return memory_wrapper.get_proactive_insights(context)

def get_memory_status() -> Dict[str, Any]:
    """Get memory system status."""
    return memory_wrapper.get_memory_status()

def get_contextual_briefing(target_persona: str, current_context: Dict[str, Any]) -> str:
    """Get memory-enhanced contextual briefing."""
    return memory_wrapper.get_contextual_briefing(target_persona, current_context) 